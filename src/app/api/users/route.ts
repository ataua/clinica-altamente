import { NextRequest } from 'next/server'
import { userController } from '@/controllers/user.controller'

export async function GET(request: NextRequest) {
  return userController.findAll(request)
}

export async function POST(request: NextRequest) {
  return userController.create(request)
}
