# Boilerplate code to get started with building RESTful API Services (Nodejs, Express, TypeORM Mysql)


```
cd existing_repo
git remote add origin 
git branch -M main
git push -uf origin main
```
### Development

```bash
npm run dev
```

### Production

```bash
pm2 start ecosystem.config.js --env production
```

### Running tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Building a container

```bash
docker build -t test/rest-api-typescript .
```

### Run docker image

```bash
docker run -p 8080:4000 -d rahulse97/rest-api-typescript
```

### Print app output
```bash
docker logs <container id>
```

### Enter the container
```bash
docker exec -it <container id> /bin/bash
```
