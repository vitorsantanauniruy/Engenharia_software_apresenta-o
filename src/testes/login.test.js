const request = require('supertest');
const app = require('../server'); // Caminho para o seu arquivo principal do Express/Node.js

describe('Testes de Unidade: Autenticação (Login)', () => {
  
  it('Deve retornar erro 400 se o usuário não enviar email ou senha', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({
        email: 'vitor@uniruy.edu.br'
        // Senha faltando de propósito
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error', 'E-mail e senha são obrigatórios.');
  });

  it('Deve retornar erro 401 (Não Autorizado) para credenciais inválidas', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({
        email: 'vitor@uniruy.edu.br',
        password: 'senha_errada_123'
      });

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('error', 'Credenciais inválidas.');
  });

  it('Deve retornar status 200 e um Token JWT ao fazer login com sucesso', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({
        email: 'vitor@uniruy.edu.br',
        password: 'senha_correta_123'
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('token'); // Verifica se o backend devolveu o token do Supabase
    expect(response.body.user).toHaveProperty('role'); // Verifica se devolveu o nível de acesso (cliente/promotor)
  });

});