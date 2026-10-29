
import bcrypt from "bcrypt";
import prisma from "../config/prisma.js";
import createTokenAndSaveCookie from "../jwt/jwt.js";


// for register controllers

export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email, and password are required",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters",
            });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email is already registered",
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                wallet: {
                    create: {},
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                wallet: {
                    select: {
                        balance: true,
                    },
                },
            },
        });
        return res.status(201).json({
            message: "User registered successfully",
            user,
        });
    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};



// for login -conntrollers
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });


        // if user didn't found
        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        // comparing user entered password and db stored password using the bcrypt.compare
        const isPasswordValid = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        // function thats creates jwt token
        createTokenAndSaveCookie({ userId: user.id, res })

        return res.status(200).json({
            message: "Login successful",
            // token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            message: "Internal server error"
        })
    }
}