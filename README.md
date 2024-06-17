
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
