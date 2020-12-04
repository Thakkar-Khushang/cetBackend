const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const multer = require("multer");

require("dotenv").config();

const Club = require("../models/club");
const Student = require("../models/student");
const Test = require("../models/test");
const Question = require("../models/question");
const Domain = require("../models/testDomain");

// @desc Add a question to a test
// @route GET /api/question/add
const addQuestion = async (req, res, next) => {
  const {
    testId,
    domainId,
    type,
    questionMarks,
    description,
    options,
  } = req.body;

  const clubId = req.user.userId;

  const question = new Question({
    _id: new mongoose.Types.ObjectId(),
    testId,
    clubId,
    domainId,
    type,
    questionMarks,
    description,
    options,
  });

  await question
    .save()
    .then(async () => {
      res.status(201).json({
        message: "Question added",
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Something went wrong",
        error: err.toString(),
      });
    });
};

// @desc Add multiple questions to a test
// @route GET /api/question/addMultiple
const addMultipleQuestions = async (req, res, next) => {
  const { testId, domainId, questions } = req.body;
  await Question.insertMany(questions)
    .then(async (result) => {
      await Question.find({ testId, domainId })
        .then(async (ques) => {
          let marks = 0;
          for (question of ques) {
            marks += question.questionMarks;
          }
          await Domain.updateOne({ _id: domainId }, { domainMarks: marks })
            .then(async () => {
              res.status(200).json({
                message: "Questions added",
                result,
              });
            })
            .catch((err) => {
              res.status(400).json({
                message: "Some error occurred",
                error: err.toString(),
              });
            });
        })
        .catch((err) => {
          res.status(400).json({
            message: "Some error occurred",
            error: err.toString(),
          });
        });
    })
    .catch((err) => {
      res.status(400).json({
        message: "Some error occurred",
        error: err.toString(),
      });
    });
};

// @desc Get all questions of a test -- accessible only to club
// @route GET /api/question/all
const getAllQuestions = async (req, res, next) => {
  const { testId } = req.body;

  await Question.find({ testId })
    .then(async (questions) => {
      res.status(200).json({
        questions,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Something went wrong",
        error: err.toString(),
      });
    });
};

module.exports = {
  addQuestion,
  addMultipleQuestions,
  getAllQuestions,
};