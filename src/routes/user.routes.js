const express = require('express');
const userModel = require('../module/user.model');
const userRouter = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require("../middleware/AuthMiddleware");

const { runUserAiAgent } = require("../agents/userAiAgent");

const getFirebaseAuth = require("../config/firebaseAdmin");



// ================= USER REGISTER =================
userRouter.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body; 
        const existingUser = await userModel.findOne({ email });

        if (existingUser) { 
            return res.status(400).json({
                message: "User already exists"
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword
        });

        await newUser.save();

        res.status(201).json({
            message: "User registered successfully",
            user: newUser
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});


// ================= USER LOGIN =================
userRouter.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }

        const token = jwt.sign({ id: user._id, name: user.name, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

        res.status(200).json({
            message: "Login successful",
            token,
            refreshToken,
            user: user
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});


// usercan chnage name and password email not be change
// ================= USER UPDATE =================
userRouter.put('/update', authMiddleware.authUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, password } = req.body;

        const updateData = {};

        // Update name
        if (name) {
            updateData.name = name;
        }

        // Update password
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        ).select('-password');

        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});




// ================= USER DELETE =================
userRouter.delete('/delete', authMiddleware.authUser, async (req, res) => {
    try {
        const userId = req.user.id;
        await userModel.findByIdAndDelete(userId);
        res.status(200).json({
            message: "User deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }

});



// ================= GET PROFILE =================
userRouter.get('/profile', authMiddleware.authUser, async (req, res) => {
    try {
        const user = await userModel
            .findById(req.user.id)
            .select('-password');

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json(user);

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});


//Google login
// ================= GOOGLE LOGIN =================



userRouter.post("/google-login", async (req, res) => {
  try {
    const { token } = req.body;

    const decodedToken = await getFirebaseAuth().verifyIdToken(token);

    let user = await userModel.findOne({
      email: decodedToken.email,
    });

    if (!user) {
      user = await userModel.create({
        name: decodedToken.name,
        email: decodedToken.email,
        role: "user",
      });
    }

    const jwtToken = jwt.sign(
      {
        id: user._id,
        name: user.name,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      token: jwtToken,
      refreshToken,
      user,
    });
  } catch (error) {
    console.error(error);

    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});


// ================= REFRESH TOKEN =================
userRouter.post("/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token is required",
      });
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (error, decoded) => {
      if (error) {
        return res.status(403).json({
          message: "Refresh token expired, please login again",
        });
      }

      const user = await userModel.findById(decoded.id);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const newToken = jwt.sign(
        { id: user._id, name: user.name, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.status(200).json({
        message: "Token refreshed successfully",
        token: newToken,
      });
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});


//AI AGENT
userRouter.post("/ai-chat", authMiddleware.authUser, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    const result = await runUserAiAgent({
      message,
      userId: req.user._id, // changed from req.user._id
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("User AI Error:", error);

    res.status(500).json({
      message: "AI assistant failed",
      error: error.message,
    });
  }
});

 

module.exports = userRouter;