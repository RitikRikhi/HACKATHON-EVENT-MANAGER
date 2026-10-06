import { Router } from 'express';
import { authenticate, ticketRateLimiter } from '@event-os/config';
import { ticketController } from '../controllers/ticket.controller';

const router = Router();

// Health check
router.get('/health', (req, res) => ticketController.getHealth(req, res));

// -----------------------------------------------------------------------------
// HELPDESK TICKETS
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// EVENT TICKETING
// -----------------------------------------------------------------------------

router.post('/', authenticate, (req, res, next) => ticketController.createTicket(req, res, next));
router.get('/', authenticate, (req, res, next) => ticketController.listTickets(req, res, next));
router.get('/code/:code', authenticate, (req, res, next) => ticketController.getTicketByCode(req, res, next));
router.get('/:id', authenticate, (req, res, next) => ticketController.getTicketById(req, res, next));
router.post('/:id/validate', (req, res, next) => ticketController.validateTicket(req, res, next));
router.patch('/:id/status', authenticate, (req, res, next) => ticketController.updateStatus(req, res, next));

export default router;
