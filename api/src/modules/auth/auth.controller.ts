import { Request, Response } from "express";

export const authController = {
    register: async (req: Request, res: Response) => {
        res.status(501).json({ ok: false, error: { message: "Not emplemented" } })
    },
    login: async (req: Request, res: Response) => {
        res.status(501).json({ ok: false, error: { message: "Not emplemented" } })
    },
    logout: async (req: Request, res: Response) => {
        res.status(501).json({ ok: false, error: { message: "Not emplemented" } })
    },
    refresh: async (req: Request, res: Response) => {
        res.status(501).json({ ok: false, error: { message: "Not emplemented" } })
    },
    forgotPassword: async (req: Request, res: Response) => {
        res.status(501).json({ ok: false, error: { message: "Not emplemented" } })
    },
    resetPassword: async (req: Request, res: Response) => {
        res.status(501).json({ ok: false, error: { message: "Not emplemented" } })
    },
    changePassword: async(req: Request, res: Response) => {
        res.status(501).json({ ok: false, error: { message: "Not emplemented" } })
    },
    me: async (req: Request, res: Response) => {
        res.status(501).json({ ok: false, error: { message: "Not emplemented" } })
    }
}