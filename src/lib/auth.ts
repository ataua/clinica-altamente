import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { verifyPassword } from "@/lib/bcrypt"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: {
    createUser: async (userData: { name?: string; email: string; emailVerified?: Date; image?: string }) => {
      return prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          emailVerified: userData.emailVerified,
          image: userData.image,
        },
      })
    },
    getUser: async (id: string) => {
      return prisma.user.findUnique({ where: { id } })
    },
    getUserByEmail: async (email: string) => {
      return prisma.user.findUnique({ where: { email } })
    },
    getUserByAccount: async (account: { provider: string; providerAccountId: string }) => {
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
    updateUser: async (data: { id: string; name?: string; email?: string; emailVerified?: Date; image?: string }) => {
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
    deleteUser: async (id: string) => {
      return prisma.user.delete({ where: { id } })
    },
    linkAccount: async (accountData: { userId: string; type: string; provider: string; providerAccountId: string; access_token?: string; refresh_token?: string; expires_at?: number; token_type?: string; scope?: string; id_token?: string; session_state?: string }) => {
      return prisma.account.create({ data: accountData })
    },
    unlinkAccount: async (account: { provider: string; providerAccountId: string }) => {
      return prisma.account.delete({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
      })
    },
    createSession: async (sessionData: { sessionToken: string; userId: string; expires: Date }) => {
      return prisma.session.create({ data: sessionData })
    },
    getSession: async (token: string) => {
      return prisma.session.findUnique({ where: { sessionToken: token } })
    },
    updateSession: async (data: { sessionToken: string; expires: Date }) => {
      return prisma.session.update({
        where: { sessionToken: data.sessionToken },
        data: { expires: data.expires },
      })
    },
    deleteSession: async (sessionToken: string) => {
      return prisma.session.delete({ where: { sessionToken } })
    },
    createVerificationToken: async (tokenData: { identifier: string; token: string; expires: Date }) => {
      return prisma.verificationToken.create({ data: tokenData })
    },
    useVerificationToken: async (tokenData: { token: string }) => {
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
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!
        token.role = (user as any).role || 'PATIENT'
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as 'ADMIN' | 'PROFESSIONAL' | 'SECRETARY' | 'PATIENT' | 'RESPONSIBLE' | 'TEACHER' | 'COORDINATOR'
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
})
