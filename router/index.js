const express=require('express');
const router=express.Router();
const User=require("../model");
const bcrypt=require('bcryptjs');
const generateToken=require('../utils');
const verifyToken = require('../middleware');
const nodemailer = require('nodemailer');

router.get('/test',(req,res)=>
    res.json({message:"Api Testing Successfully"})
);

router.post('/user',async (req,res)=>{
    const{email,password}=req.body;

    const user=await User.findOne({email});

    if(!user){
        const hashedPassword=await bcrypt.hash(password,10);

        const newUser=new User({email,password: hashedPassword});

        await newUser.save();

        return res.status(201).json({message:"user created"});

    }
    res.status(404).json({message:"user Already Exists"});
});

router.post('/auth',async(req,res)=>{
    const {email,password}=req.body;

    const user=await User.findOne({email});

    if(!user){
        return res.status(404).json({message:"User not found"});

    }
    const isMatch=await bcrypt.compare(password,user.password);

    if(!isMatch){
        return res.status(404).json({message:"incorrect password"});

    }
    const token=generateToken(user);
    res.json({token});
});

router.get('/data',verifyToken,(req,res)=>{
    res.json({message:`Welcome, ${req.user.email}! This is Protected data`});
});

router.post("/resetpassword",async(req,res)=>{
    const {email}=req.body;

    const user=await User.findOne({email});

    if(!user){
        return res.status(404).json({message:"User not found"});
    }

    const token =Math.random().toString(36).slice(-8);
    user.restPasswordToken=token;
    user.restPasswordExpires=Date.now()+3600000;

    await user.save();

    const transporter=nodemailer.createTransport({
        service:"gmail",
        auth:{
            user:"gowthamarulmurugan2003@gmail.com",
            pass:"ydulmvhfuxvdscki"
        }
    });

    const message={
        from:'gowthamarulmurugan2003@gmail.com',
        to:user.email,
        subject:"Password reset request",
        text:`youre request for the token \n please use the following token:${token}`
    };

    transporter.sendMail(message, (err,info)=>{
        if(err){
            res.status(404).json({message:"Something went wrong"});
        }
        res.status(200).json({message:"Email sent"+ info.response});
    });
});

router.post('/resetpassword/:token',async (req,res)=>{
    const {token}=req.params;
    const {password}=req.body;

    const user=await User.findOne({
        restPasswordToken:token,
        restPasswordExpires: {$gt: Date.now()},

    });
    if(!user) {
        return res.status(404).json({message:"invalidToken"})
    }

    const hashPassword =await bcrypt.hash(password,10);
    user.password =hashPassword;
    user.restPasswordToken=null;
    user.restPasswordExpires=null;

    await user.save();

    res.json({message:"password changed successfully"})
});


module.exports=router;