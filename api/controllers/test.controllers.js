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

// @desc Create a test
// @route POST /api/test/create
const create = async (req, res, next) => {
  const {
    roundNumber,
    roundType,
    instructions,
    scheduledForDate,
    scheduledEndDate,
  } = req.body;

  if (
    !roundNumber ||
    !roundType ||
    !instructions ||
    !!scheduledForDate ||
    !scheduledEndDate
  ) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.body",
    });
  }

  const clubId = req.user.userId;

  const test = new Test({
    _id: new mongoose.Types.ObjectId(),
    clubId,
    roundNumber,
    roundType,
    instructions,
    scheduledForDate,
    scheduledEndDate,
  });

  await test
    .save()
    .then(async (result) => {
      res.status(201).json({
        message: "Test created",
        testDetails: result,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Something went wrong",
        error: err.toString(),
      });
    });
};

// @desc Get a test by ID
// @route GET /api/test/details?testId=
const getTestDetails = async (req, res, next) => {
  const { testId } = req.query;

  if (!testId) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.query",
    });
  }

  await Test.findById(testId)
    .then(async (test) => {
      res.status(200).json({
        test,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Something went wrong",
        error: err.toString(),
      });
    });
};

// @desc Apply for a test
// @route GET /api/test/apply
const apply = async (req, res, next) => {
  const { testId, clubId } = req.body;
  const studentId = req.user.userId;
  const appliedOn = Date.now();
  let flag = 0;
  await Test.findById(testId)
    .then(async (test) => {
      //Check if a user has already applied for the test
      for (i in test.users) {
        if (test.users[i].studentId == studentId) {
          flag = 1;
        }
      }

      if (flag === 1) {
        return res.status(420).json({
          message: "You have already applied for the test",
        });
      }

      //Check if a user has already given a test
      for (i in test.usersStarted) {
        if (test.usersStarted[i].studentId == studentId) {
          flag = 2;
        }
      }
      for (i in test.usersFinished) {
        if (test.usersFinished[i].studentId == studentId) {
          flag = 2;
        }
      }
      if (flag === 2) {
        return res.status(409).json({
          message: "You have already given the test",
        });
      }
    })
    .catch();

  await Test.updateOne({ _id: testId }, { $push: { users: { studentId } } })
    .then(async () => {
      await Student.updateOne(
        { _id: studentId },
        { $push: { tests: { testId, clubId, appliedOn, status: "Applied" } } }
      )
        .then(async () => {
          res.status(200).json({
            message: "Applied successfully",
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: "Something went wrong",
            error: err.toString(),
          });
        });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Something went wrong",
        error: err.toString(),
      });
    });
};

// @desc Attempt a test
// @route GET /api/test/Attempt
const attempt = async (req, res, next) => {
  const { testId } = req.body;
  const studentId = req.user.userId;
  const now = Date.now();
  let flag = 0;
  let appliedFlag = 0;

  await Test.findById(testId)
    .populate("clubId", "name email type")
    .then(async (test) => {
      //Check if user has already given the test
      for (i in test.usersStarted) {
        if (test.usersStarted[i].studentId == studentId) {
          flag = 1;
        }
      }
      for (i in test.usersFinished) {
        if (test.usersFinished[i].studentId == studentId) {
          flag = 1;
        }
      }
      if (flag === 1) {
        return res.status(409).json({
          message: "You have already given the test",
        });
      }

      //Check if a user didn't apply for a test
      for (i in test.users) {
        if (test.users[i].studentId == studentId) {
          appliedFlag = 1;
          break;
        }
      }

      if (appliedFlag === 0) {
        return res.status(430).json({
          message: "You have not applied for the test",
        });
      }

      //Check if test hasn't started
      if (test.scheduledForDate > now) {
        return res.status(418).json({
          message: "Test hasn't started yet",
        });
      }

      //Check if test is over
      if (test.scheduledEndDate <= now) {
        return res.status(420).json({
          message: "Test is over",
        });
      }

      await Test.updateOne(
        { _id: testId },
        {
          $pull: { users: { studentId } },
          $push: { usersStarted: { studentId } },
        }
      )
        .then(async () => {
          await Student.updateOne(
            { _id: studentId, "tests.testId": testId },
            // { $set: { startedOn: now, status: "Started" } }
            {
              $set: { "tests.$.status": "Started", "tests.$.startedOn": now },
              // $set: { startedOn: now },
            }
          )
            .then(async () => {
              await Domain.find({ testId })
                .select("-__v")
                .then(async (domains) => {
                  res.status(200).json({
                    clubDetails: test.clubId,
                    testDetails: {
                      _id: test._id,
                      roundNumber: test.roundNumber,
                      roundType: test.roundType,
                      instructions: test.instructions,
                      scheduledForDate: test.scheduledForDate,
                      scheduledEndDate: test.scheduledEndDate,
                      graded: test.graded,
                    },
                    domains,
                  });
                })
                .catch((err) => {
                  res.status(500).json({
                    message: "Something went wrong",
                    error: err.toString(),
                  });
                });
            })
            .catch((err) => {
              res.status(500).json({
                message: "Something went wrong",
                error: err.toString(),
              });
            });
        })
        .catch((err) => {
          res.status(500).json({
            message: "Something went wrong",
            error: err.toString(),
          });
        });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Something went wrong",
        error: err.toString(),
      });
    });
};

const attemptFuncOld = async (req, res, next) => {
  const { testId } = req.body;
  const studetntId = req.user.userId;
  const now = Date.now();
  let flag = 0;
  let questionsArr = [];

  await Test.findById(testId)
    .then(async (test) => {
      //Check if user has already given the test
      for (i in test.usersStarted) {
        if (test.usersStarted[i].studentId == studetntId) {
          flag = 1;
        }
      }
      for (i in test.usersFinished) {
        if (test.usersFinished[i].studentId == studetntId) {
          flag = 1;
        }
      }
      if (flag === 1) {
        return res.status(409).json({
          message: "You have already given the quiz",
        });
      }

      //Check if quiz is over
      if (test.scheduledEndDate >= now) {
        return res.status(420).json({
          message: "Quiz is over",
        });
      }

      //Check if quiz hasn't started
      if (test.scheduledForDate < now) {
        return res.status(418).json({
          message: "Quiz hasn't started",
        });
      }

      await Test.updateOne(
        { _id: testId },
        {
          $pull: { users: { studentId } },
          $push: { usersStarted: { studentId } },
        }
      )
        .then(async () => {
          await Student.updateOne(
            { _id: studentId },
            { $set: { startedOn: now } }
          )
            .then(async () => {
              await Question.find({ testId })
                .then(async (questions) => {
                  for (let question of questions) {
                    let obj = {};
                    obj.questionId = question._id;
                    obj.questionType = question.type;
                    obj.questionMarks = question.questionMarks;
                    obj.description = question.description;
                    if (question.options.length >= 1) {
                      obj.options = [];

                      for (let option of question.options) {
                        let optionObj = {};
                        optionObj.optionId = option._id;
                        optionObj.text = option.option.text;
                        obj.options.push(optionObj);
                      }
                    }

                    questionsArr.push(obj);
                  }
                  res.status(200).json({
                    questionsArr,
                  });
                })
                .catch((err) => {
                  res.status(500).json({
                    message: "Something went wrong",
                    error: err.toString(),
                  });
                });
            })
            .catch((err) => {
              res.status(500).json({
                message: "Something went wrong",
                error: err.toString(),
              });
            });
        })
        .catch((err) => {
          res.status(500).json({
            message: "Something went wrong",
            error: err.toString(),
          });
        });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Something went wrong",
        error: err.toString(),
      });
    });
};

// @desc Get all applied tests
// @route GET /api/test/allApplied
const allApplied = async (req, res, next) => {
  const studentId = req.user.userId;

  await Student.findById(studentId)
    .then(async (student) => {
      for (i in student.tests) {
        if (!student.tests[i].startedOn) {
          testsArr.push(student.tests[i]);
        }
      }

      res.status(200).json({
        tests: testsArr,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Something went wrong",
        error: err.toString(),
      });
    });
};

// @desc Get all submitted tests
// @route GET /api/test/allSubmitted
const allSubmitted = async (req, res, next) => {
  const studentId = req.user.userId;

  await Student.findById(studentId)
    .then(async (student) => {
      for (i in student.tests) {
        if (student.tests[i].startedOn && !student.tests[i].submittedOn) {
          testsArr.push(student.tests[i]);
        }
      }

      res.status(200).json({
        tests: testsArr,
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
  create,
  getTestDetails,
  apply,
  attempt,
  allApplied,
  allSubmitted,
};