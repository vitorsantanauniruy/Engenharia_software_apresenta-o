export interface EventProps { 
  id: number; 
  title: string; 
  date: string; 
  price: number; 
  imageUrl: string; 
}

export interface TicketProps { 
  ticketId: string; 
  eventId: number; 
  eventName: string; 
  date: string; 
  type: string; 
  buyer: string; 
}