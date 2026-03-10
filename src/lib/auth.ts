import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { verifyPassword } from "@/lib/bcrypt"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: {
    // Minimal adapter implementation for Prisma
    createUser: async (userData) => {
      return prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          emailVerified: userData.emailVerified,
          image: userData.image,
        },
      })
    },
    getUser: async (id) => {
      return prisma.user.findUnique({ where: { id } })
    },
    getUserByEmail: async (email) => {
      return prisma.user.findUnique({ where: { email } })
    },
    getUserByAccount: async (account) => {
      const accountRecord = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
      })
      if (!accountRecord) return null
      return prisma.user.findUnique({ where: { id: accountRecord.userId } })
    },
    updateUser: async (data) => {
      if (!data.id) throw new Error("User id is required")
      return prisma.user.update({
        where: { id: data.id },
        data: {
          name: data.name,
          email: data.email,
          emailVerified: data.emailVerified,
          image: data.image,
        },
      })
    },
    deleteUser: async (id) => {
      return prisma.user.delete({ where: { id } })
    },
    linkAccount: async (accountData) => {
      return prisma.account.create({ data: accountData })
    },
    unlinkAccount: async (account) => {
      return prisma.account.delete({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
      })
    },
    createSession: async (sessionData) => {
      return prisma.session.create({ data: sessionData })
    },
    getSession: async (token) => {
      return prisma.session.findUnique({ where: { sessionToken: token } })
    },
    updateSession: async (data) => {
      return prisma.session.update({
        where: { sessionToken: data.sessionToken },
        data: { expires: data.expires },
      })
    },
    deleteSession: async (sessionToken) => {
      return prisma.session.delete({ where: { sessionToken } })
    },
    createVerificationToken: async (tokenData) => {
      return prisma.verificationToken.create({ data: tokenData })
    },
    useVerificationToken: async (tokenData) => {
      const token = await prisma.verificationToken.findUnique({
        where: { token: tokenData.token },
      })
      if (!token) return null
      await prisma.verificationToken.delete({
        where: { token: tokenData.token },
      })
      return token
    },
  } as any,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.password) {
          return null
        }

        const isValid = await verifyPassword(
          credentials.password as string,
          user.password
        )

        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
})
