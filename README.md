### Introduction

This repository contains a back end for a personal portfolio project "Health Center".


### Table of Contents

- [Introduction](#introduction)
- [Table of Contents](#table-of-contents)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Features](#features)


### Architecture

- Node express
- TypeORM
- GraphQL
- SQL
- Docker
- Azure


### Folder Structure

Root Folder
└── src
    ├── schema.ts
    ├── app.ts
    ├── index.ts
    ├──  / configurations
    │   ├── db.config.ts
    │   └── app.config.ts
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
        └── / user
            ├── user.ts
            ├── user.input.ts
            ├── user.model.ts
            ├── user-role.model.ts
            ├── user.resolver.ts
            └── user.mutation.resolver.ts


### Features

- Google authentication
- Nodemailer email service
