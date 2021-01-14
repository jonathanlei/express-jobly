"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
  ensureIsAdmin,
  ensureAdminOrCurrentUser
} = require("./auth");


const { SECRET_KEY } = require("../config");
const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");


describe("authenticateJWT", function () {
  test("works: via header", function () {
    expect.assertions(2);
    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number),
        username: "test",
        isAdmin: false,
      },
    });
  });

  test("works: no header", function () {
    expect.assertions(2);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });

  test("works: invalid token", function () {
    expect.assertions(2);
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });
});


describe("ensureAdmin", function () {
  test("works", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: { user: { username: "test",  isAdmin: false } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureLoggedIn(req, res, next);
  });

  test("unauth if no login", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureLoggedIn(req, res, next);
  });
});

describe("ensureIsAdmin", function () {
  test("logged in but not admin", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: { user: { username: "test",  isAdmin: false } } };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureIsAdmin(req, res, next);
  });

  test("isAdmin", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: { user: { username: "test",  isAdmin: true } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureIsAdmin(req, res, next);
  });

  test("unauth if no login", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureIsAdmin(req, res, next);
  });
});


describe("ensureAdminOrCurrentUser", function () {

  test("logged in as current user but not admin ", function () {
    expect.assertions(1);
    const req = {params: {username: "test"}};
    const res = { locals: { user: { username: "test",  isAdmin: false } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureAdminOrCurrentUser(req, res, next);
  });

  test("logged in as Admin but not current user", function () {
    expect.assertions(1);
    const req = {params: {username: "test1"}};
    const res = { locals: { user: { username: "test",  isAdmin: true } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureAdminOrCurrentUser(req, res, next);
  });
  

  test("logged in as both admin and current user", function () {
    expect.assertions(1);
    const req = {params: {username: "test"}};
    const res = { locals: { user: { username: "test",  isAdmin: true } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureAdminOrCurrentUser(req, res, next);
  });

  test("logged in not as current user or admin", function () {
    expect.assertions(1);
    const req = {params: {username: "test"}};
    const res = { locals: { user: { username: "test2",  isAdmin: false } } };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureAdminOrCurrentUser(req, res, next);
  });


  test("unauth if no login", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureAdminOrCurrentUser(req, res, next);
  });
});