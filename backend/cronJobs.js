import cron from 'node-cron';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Configuração do transporter (envio de e-mail via SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'false' ? false : true, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Senha de aplicativo no caso do Gmail
  },
});

async function sendMonthlyReport() {
  console.log('Iniciando geração do relatório mensal...');
  
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.REPORT_EMAIL_TO) {
    console.error('Credenciais de e-mail ou destinatário não configurados. Verifique o .env');
    return;
  }

  try {
    const now = new Date();
    // Pega o primeiro dia do mês anterior
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    // Pega o último dia do mês anterior
    const endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    
    const monthName = startDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    // Buscar pedidos no período (apenas pagos ou entregues)
    const orders = await prisma.order.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate
        },
        status: 'delivered' // ou todos os fechados
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
    const totalOrders = orders.length;

    // Buscar produtos mais vendidos
    const productCounts = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const pName = item.product.name;
        if (!productCounts[pName]) productCounts[pName] = { quantity: 0, revenue: 0 };
        productCounts[pName].quantity += item.quantity;
        productCounts[pName].revenue += item.quantity * item.unit_price;
      });
    });

    const topProducts = Object.entries(productCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5); // top 5

    // Montar o E-mail em HTML
    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
        <h2 style="color: #511F26; text-align: center; border-bottom: 2px solid #511F26; padding-bottom: 10px;">
          Resumo Mensal - ${monthName.toUpperCase()}
        </h2>
        
        <p>Olá! Segue o resumo financeiro e de vendas do seu restaurante do último mês:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #3D312A;">Faturamento</h3>
          <p style="font-size: 1.2rem; margin: 5px 0;"><strong>Total Faturado:</strong> R$ ${totalRevenue.toFixed(2).replace('.', ',')}</p>
          <p style="font-size: 1.2rem; margin: 5px 0;"><strong>Pedidos Entregues:</strong> ${totalOrders}</p>
          <p style="font-size: 1.2rem; margin: 5px 0;"><strong>Ticket Médio:</strong> R$ ${totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2).replace('.', ',') : '0,00'}</p>
        </div>
        
        <h3 style="color: #3D312A;">Top 5 Produtos Mais Vendidos</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #3D312A; color: white;">
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Produto</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Qtd</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Receita</th>
            </tr>
          </thead>
          <tbody>
            ${topProducts.map(p => `
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">${p.name}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${p.quantity}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">R$ ${p.revenue.toFixed(2).replace('.', ',')}</td>
              </tr>
            `).join('')}
            ${topProducts.length === 0 ? '<tr><td colspan="3" style="padding: 10px; text-align: center; border: 1px solid #ddd;">Nenhuma venda registrada.</td></tr>' : ''}
          </tbody>
        </table>
        
        <p style="font-size: 0.9rem; color: #666; text-align: center; margin-top: 30px;">
          Relatório gerado automaticamente pelo Sistema do Restaurante.
        </p>
      </div>
    `;

    // Opções de envio
    const mailOptions = {
      from: `"Sistema Restaurante" <${process.env.SMTP_USER}>`,
      to: process.env.REPORT_EMAIL_TO,
      subject: `Relatório Mensal de Vendas - ${monthName}`,
      html: htmlTemplate
    };

    // Enviar
    const info = await transporter.sendMail(mailOptions);
    console.log('E-mail enviado com sucesso:', info.messageId);

  } catch (error) {
    console.error('Erro ao gerar e enviar relatório mensal:', error);
  }
}

// Agendar para o dia 1 de cada mês às 08:00 da manhã
// Formato cron: "0 8 1 * *" (Minuto Hora DiaDoMês Mês DiaDaSemana)
export function initCronJobs() {
  console.log('Inicializando tarefas agendadas (Cron Jobs)...');
  
  // Agendamento real (Dia 1 de cada mês às 8h)
  cron.schedule('0 8 1 * *', async () => {
    console.log('Executando cron job: Relatório Mensal');
    await sendMonthlyReport();
  });
}
