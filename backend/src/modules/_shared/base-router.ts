import { Router } from 'express';

export class BaseRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.initRoutes();
  }

  initRoutes(): void {
    // Override in subclass
  }
}
