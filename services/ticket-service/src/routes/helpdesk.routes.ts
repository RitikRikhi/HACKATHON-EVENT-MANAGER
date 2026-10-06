import { Router } from 'express';
import { authenticate, ticketRateLimiter } from '@event-os/config';
import { ticketController } from '../controllers/ticket.controller';

const router = Router();

router.post('/', authenticate, ticketRateLimiter, (req, res, next) =>
  ticketController.createHelpdeskTicket(req, res, next)
);
router.get('/', authenticate, (req, res, next) =>
  ticketController.listHelpdeskTickets(req, res, next)
);
router.get('/:id', authenticate, (req, res, next) =>
  ticketController.getHelpdeskTicketById(req, res, next)
);
router.patch('/:id', authenticate, (req, res, next) =>
  ticketController.updateHelpdeskTicket(req, res, next)
);

// Aliases for /helpdesk
router.post('/helpdesk', authenticate, ticketRateLimiter, (req, res, next) =>
  ticketController.createHelpdeskTicket(req, res, next)
);
router.get('/helpdesk', authenticate, (req, res, next) =>
  ticketController.listHelpdeskTickets(req, res, next)
);
router.get('/helpdesk/:id', authenticate, (req, res, next) =>
  ticketController.getHelpdeskTicketById(req, res, next)
);
router.patch('/helpdesk/:id', authenticate, (req, res, next) =>
  ticketController.updateHelpdeskTicket(req, res, next)
);

export default router;
