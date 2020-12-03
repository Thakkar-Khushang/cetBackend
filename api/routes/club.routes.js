const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const clubControllers = require("../controllers/club.controllers");

const checkAuthClub = require("../middleware/checkAuthClub");

const router = express.Router();

//Club signup
router.post("/signup", clubControllers.signup);

//Club email verification
router.post("/email/verify", clubControllers.verifyEmail);

//Club login
router.post("/login", clubControllers.login);

//Update club's profile
router.patch("/profile", checkAuthClub, clubControllers.updateProfile);

//Feature or unfeature a club for recruitments
router.patch("/feature", checkAuthClub, clubControllers.feature);

//Get all featured clubs
router.get("/allFeatured", clubControllers.getAllFeaturedClubs);

module.exports = router;
