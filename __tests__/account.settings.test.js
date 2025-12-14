const request = require('supertest');
const app = require('../app/testApp');
const User = require('../app/Models/user');
const mongoose = require('mongoose');

describe('Account Settings API', () => {
  let token, uid, password = 'TestPass123!';

  beforeAll(async () => {
    await User.deleteMany({});
    // Register a user
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@settings.com',
        password,
        role: 'student',
        school: 'Test U',
        fieldOfStudy: 'CS'
      });
    token = res.body.data.token;
    uid = res.body.data.user.uid;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  test('should update email with correct password', async () => {
    const res = await request(app)
      .patch('/api/users/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        newEmail: 'newemail@settings.com',
        confirmNewEmail: 'newemail@settings.com',
        currentPassword: password
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('should fail email update with wrong current password', async () => {
    const res = await request(app)
      .patch('/api/users/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        newEmail: 'fail@settings.com',
        confirmNewEmail: 'fail@settings.com',
        currentPassword: 'wrongpass'
      });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('should update password with correct password', async () => {
    const res = await request(app)
      .patch('/api/users/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        newPassword: 'NewPass456!',
        confirmNewPassword: 'NewPass456!',
        currentPassword: password
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('should fail if new passwords do not match', async () => {
    const res = await request(app)
      .patch('/api/users/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        newPassword: 'Mismatch1',
        confirmNewPassword: 'Mismatch2',
        currentPassword: password
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should fail if no changes specified', async () => {
    const res = await request(app)
      .patch('/api/users/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: password });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
