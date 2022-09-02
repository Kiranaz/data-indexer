import { NestFactory } from '@nestjs/core';
import axios from 'axios';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(8080);
  axios.get('http://localhost:8080/');
}
bootstrap();
