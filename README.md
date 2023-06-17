# blog-api

## Live
https://blog-api-yk7t.onrender.com/api/v1

**This is an express server that uses a free tier web service hosted on render.com. It sleeps after not being in use for 15 minutes. Please try again after 15 to 30 seconds if a JSON response is not returned.**

## Description
TOP - Blog API project - API

### Introduction
This is the backend API part of the project. The API connects to a MongoDB database to fetch and persist user data.

### Security
#### JSON Web Tokens
The server uses JSON web tokens (JWT) to authenticate users. The authentication controller provides middleware to parse the token and set the user on the request object for routes with HTTP methods that require authentication. For balancing security with user experience, JWT allows a user to stay signed in, even after closing their browser. Actually two tokens are used; a short lived access token and a long term refresh token. When a user signs in, both tokens are returned to the client. The client uses the access token to authenticate themselves. The access token has a five minute expiry. If the client sends a request with an expired access token, then the server returns a 403 response which prompts the client to refresh the access token. This is done using the refresh token which lasts for a long time (28 days). The server verifies the refresh token which is saved to the user document in the database. Only one refresh token can be valid. New refresh tokens replace the last one. If the refresh token from the database matches the one sent in the request authorization header, then a new access token is created and sent back. The refresh token expiry is long but unlike the access token, it can be deleted from the database and rendered unusable. The refresh token expiry forces the user to login at least once a month but this could be set to a shorter time as needed.

The advantage and the flaw with JSON tokens is that they are stateless. An advantage because they work well with HTTP, a stateless protocol, but a disadvantage because they allow access as long as long as they remain unexpired. That is why the expiry time is short but not too short to dismiss the advantage of being stateless, as database queries for re-authentication are only done, at most, once every 5 minutes and not with every request. With the refresh token, the user does not need to sign in every 5 minutes but can be re-authenticated automatically. If the access token is compromised the hacker will have access for up to 5 minutes. The user can log out. This will wipe the refresh token from the database which means that login with email and password is required to re-authenticate. A database admin could also delete the refresh token which will prevent access token renewal.

In the event that the server or database is compromised then the secret keys used to sign and verify tokens could be changed which would invalidate them, requiring all users to sign in again.

#### Password
Passwords are hashed and are verified using bcrypt. Hashing passwords protects against rainbow attacks and discovering the plain text password in the event of a database breach. Hashed passwords are not send back to the user. Changing the password can be done by the client but requires the current password for security such as if the access token was stolen or an unauthorized physical user had access to the device. A lost password would be reset using an email token sent to the users verified email account but that is not implemented in this project.

## Blog Manager
### Code
https://github.com/jundran/blog-manager
### Live
https://jundran.github.io/blog-manager

## Blog Viewer
### Code
https://github.com/jundran/blog-viewer
### Live
https://jundran.github.io/blog-viewer

## Requriements
https://www.theodinproject.com/lessons/nodejs-blog-api
