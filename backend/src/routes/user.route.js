import express from "express"
import { getUserProfile, syncUser, updateProfile, getCurrentUser, followUser, searchUsers } from "../controllers/user.controller.js"
import {protectRoute} from "../middleware/auth.middleware.js"

const router = express.Router()
router.get("/profile/:username", getUserProfile)
router.get("/me", protectRoute, getCurrentUser)
router.get("/search", protectRoute, searchUsers)
router.post("/sync", protectRoute, syncUser)
router.put("/profile", protectRoute, updateProfile)
router.post("/follow/:targetUserId", protectRoute, followUser)

export default router