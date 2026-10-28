import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { getEnvConfig } from '../src/config/env';

const authFile = path.resolve('.auth/customer.json');

setup('authenticate via Toolshop API and persist storageState', async ({ request }) => {
  const env = getEnvConfig();

  const response = await request.post(`${env.apiURL}/users/login`, {
    data: {
      email: env.userEmail,
      password: env.userPassword,
    },
  });

  expect(response.ok(), `API Login failed with status ${response.status()}`).toBeTruthy();
  const body = await response.json();
  expect(body.access_token).toBeTruthy();

  if (!fs.existsSync('.auth')) {
    fs.mkdirSync('.auth', { recursive: true });
  }

  const origin = new URL(env.baseURL).origin;
  const storageState = {
    cookies: [],
    origins: [
      {
        origin,
        localStorage: [
          {
            name: 'auth-token',
            value: body.access_token,
          },
        ],
      },
    ],
  };

  fs.writeFileSync(authFile, JSON.stringify(storageState, null, 2));
});
