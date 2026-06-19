const request = require("supertest");
const { createApp } = require("../../src/app");

describe("Health Router - stub", () => {
  test("GET /api/v1/health devuelve UP", async () => {
    const app = createApp();

    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "UP" });
  });
});
