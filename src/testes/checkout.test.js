const request = require('supertest');
const app = require('../server'); // O arquivo principal da sua API Node.js

describe('Testes de Unidade: API de Ingressos', () => {
  
  it('Deve retornar erro 400 se tentar comprar sem enviar o ID do Cliente', async () => {
    const response = await request(app)
      .post('/api/comprar')
      .send({
        ticket_id: '12345-uuid',
        // customer_id está faltando de propósito
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error', 'ID do cliente é obrigatório');
  });

  it('Deve retornar sucesso 201 ao criar um pedido válido', async () => {
    const response = await request(app)
      .post('/api/comprar')
      .send({
        customer_id: '98765-uuid',
        ticket_id: '12345-uuid'
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('status', 'Pendente');
  });

});