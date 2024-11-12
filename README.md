### Introduction

This repository contains server side logic for a professional portfolio project "Health Center". The project is deployed via [Render](www.render.com). The application database service provided via [FreeSqlDatabase](www.freesqldatabase.com).

___


### Table of Contents

- [Introduction](#introduction)
- [Table of Contents](#table-of-contents)
- [Technologies Used](#technologies-used)
- [Folder Structure](#folder-structure)
- [Features](#features)
    - [API](#api)
    - [ERD](#erd)
    - [User permissions](#user-permissions)

___

### Technologies Used

- **Backend**: Node.js, Express
- **Database**: TypeORM with SQL databases (MySQL, SQL Server)
- **Real-time Communication**: Socket.IO
- **Testing**: Jest

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
        └──  / chat_participant
            └── ...
```


___

## Features

- **User Authentication**: Secure login for both patients and doctors, with role-based access.
- **Appointment Booking**: Patients can book appointments directly with doctors.
- **Appointment Management**: Doctors can view, update, and cancel their appointments.
- **Real-time Notifications**: Instant notifications for users regarding appointment updates and status changes.
- **Chat System**: Real-time chat functionality for communication between patients and healthcare providers.
- **Admin Dashboard**: For managing users, appointments, and viewing statistics.


##### Data & API

This backend serves GraphQL API, with SQL database connection (MSSQL locally, MySQL in production). Currently the dataset consists of 9 tables (appointment, chat, chat_participant, chat_participants_user, doctor_request, message, record, user, user_role). 


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
|medical_record||GET|GET|
|||CREATE*||
|||UPDATE*||
|||DELETE||
|appointment||GET|GET|
||CREATE||CREATE|
||UPDATE|UPDATE*|UPDATE|
||DELETE|DELETE*|DELETE*|
  