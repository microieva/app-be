### Introduction

This repository contains server side logic for a professional portfolio project "Health Center". The project is deployed via [Render](www.render.com). MySQL Database service: [Aiven.io](www.aiven.io). 
[Visit Health Center](https://health-center-ten.vercel.app/)

___


### Table of Contents

- [Introduction](#introduction)
- [Table of Contents](#table-of-contents)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Features](#features)
    - [API](#api)
    - [ERD](#erd)
    - [User permissions](#user-permissions)

___

### Architecture

- Node express
- GraphQL
- TypeORM
- MySQL
- Docker

___

### Source Folder Structure

```
Root Folder
└── src
    ├── schema.ts
    ├── index.ts
    ├──  / configurations
    │   ├── dev-db.config.ts
    │   └── prod-db.config.ts
    ├──  / services
    │   └── email.service.ts
    ├──  / migration
    └──  / graphql
        ├── query.resolver.ts
        ├── resolvers.ts
        ├── types.ts
        ├── / appointment
        │   ├── appointment.ts
        │   ├── appointment.input.ts
        │   ├── appointment.model.ts
        │   ├── appointment.resolver.ts
        │   └── appointment.mutation.resolver.ts
        ├── / doctor-request
        │   ├── doctor-request.ts
        │   ├── doctor-request.model.ts
        │   └── doctor-request.mutation.resolver.ts
        ├── / record
        │   ├── record.ts
        │   ├── record.input.ts
        │   ├── record.model.ts
        │   ├── record.resolver.ts
        │   └── record.mutation.resolver.ts
        ├── / user
        │   ├── user.ts
        │   ├── user.input.ts
        │   ├── user.model.ts
        │   ├── user-role.model.ts
        │   ├── user.resolver.ts
        │   └── user.mutation.resolver.ts
        ├── / chat
        │   └── ...
        ├── / message
        │   └── ...
        ├── / chat_participant
        │   └── ...
        └── / feedback
            └── ...
```


___

### Features

- GraphQL API
- Google authentication
- FTN (Finnish Trust Network) bank authentication (_Signicat Sandbox_)
- Nodemailer email service
- Socket.IO real-time notifications
  

##### Data & API

This backend serves GraphQL API, with SQL database connection. Currently the dataset consists of 10 tables (appointment, chat, chat_participant, chat_participants_user, doctor_request, message, record, user, user_role and feedback). User features cover three user roles (patient, doctor and admin). 


##### ERD 

![](./erd.png)



##### User permissions


'*' marks operations that trigger email notification. Doctor action send notification to patient; patient action, to doctor.



|entity / user_role|admin |doctor  | patient|
--- | --- | --- | ---|
|user|GET|GET|GET|
||CREATE||CREATE*|
||UPDATE|UPDATE|UPDATE|
||DELETE|DELETE|DELETE|
|doctor_request|GET|||
|||CREATE||
||UPDATE|||
||DELETE|||
|record||GET|GET|
|||CREATE*||
|||UPDATE*||
|||DELETE||
|appointment||GET|GET|
||CREATE||CREATE|
||UPDATE|UPDATE*|UPDATE|
||DELETE|DELETE*|DELETE*|
|message|GET|GET||
|message|CREATE|CREATE||
|feedback|GET|||
||DELETE|||
  