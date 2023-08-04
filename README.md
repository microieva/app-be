# City of Glendale - Beeline


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
docker build -t rahulse97/rest-api-typescript .
```

### Run docker image

```bash
docker run -p 8080:3000 -d rahulse97/rest-api-typescript
```

### Print app output
```bash
docker logs <container id>
```

### Enter the container
```bash
docker exec -it <container id> /bin/bash
```
