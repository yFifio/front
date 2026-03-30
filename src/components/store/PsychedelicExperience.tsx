import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BadgePercent, CreditCard, Headset, ShieldCheck, Sparkles, Truck } from 'lucide-react';

const mantras = [
  'Frete grátis nas compras acima de R$ 149',
  'Pagamento seguro e aprovação rápida',
  'Livros digitais com liberação imediata',
  'Suporte humanizado para ajudar no pedido',
];

const benefits = [
  {
    icon: ShieldCheck,
    title: 'Compra protegida',
    description: 'Checkout com mais confiança para o cliente finalizar o pedido sem insegurança.',
    accent: 'from-fuchsia-500/60 via-purple-500/50 to-cyan-400/60',
  },
  {
    icon: Truck,
    title: 'Entrega para todo o Brasil',
    description: 'Opções para produtos físicos e envio rápido para digital logo após a confirmação.',
    accent: 'from-cyan-400/60 via-emerald-400/50 to-lime-300/60',
  },
  {
    icon: Headset,
    title: 'Atendimento próximo',
    description: 'Canal direto para tirar dúvidas sobre pedidos, downloads e recomendações.',
    accent: 'from-orange-400/70 via-pink-500/60 to-rose-500/60',
  },
];

const storeHighlights = [
  { label: 'Pedidos aprovados', value: '24h por dia', icon: CreditCard },
  { label: 'Ofertas da semana', value: 'cupons e combos', icon: BadgePercent },
  { label: 'Seleção especial', value: 'ebooks e físicos', icon: Sparkles },
];

export function PsychedelicExperience() {
  const [activeMantra, setActiveMantra] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveMantra((current) => (current + 1) % mantras.length);
    }, 2400);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 px-5 py-8 backdrop-blur-2xl shadow-playful md:px-8 md:py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(217,70,239,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.2),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.72),rgba(76,29,149,0.3),rgba(17,24,39,0.82))]" />
      <motion.div
        className="absolute -left-20 top-8 h-40 w-40 rounded-full bg-fuchsia-500/30 blur-3xl"
        animate={{ x: [0, 30, -10, 0], y: [0, 18, -12, 0], scale: [1, 1.15, 0.95, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-cyan-400/25 blur-3xl"
        animate={{ x: [0, -25, 10, 0], y: [0, -20, 12, 0], scale: [1, 0.92, 1.1, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100">
              <BadgePercent className="h-4 w-4 text-fuchsia-300" />
              Vantagens da loja
            </div>

            <h2 className="text-2xl font-black leading-tight text-white md:text-4xl">
              Compre com facilidade, receba com rapidez e encontre produtos para colorir em um só lugar.
            </h2>

            <motion.div
              key={activeMantra}
              initial={{ opacity: 0, y: 18, filter: 'blur(12px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="inline-flex items-center gap-3 rounded-full border border-fuchsia-300/20 bg-slate-950/40 px-4 py-3 text-sm font-semibold text-fuchsia-100 shadow-[0_0_35px_rgba(217,70,239,0.25)]"
            >
              <CreditCard className="h-4 w-4 text-cyan-300" />
              {mantras[activeMantra]}
            </motion.div>

            <p className="max-w-2xl text-sm leading-7 text-cyan-50/80 md:text-base">
              Explore livros digitais e físicos com categorias organizadas, promoções em destaque e um processo de compra pensado para vender de verdade.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="glass-panel rounded-[1.75rem] p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-100/70">Destaques da loja</span>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-200">Live</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {storeHighlights.map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ delay: index * 0.08, duration: 0.35 }}
                    className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                      <Icon className="h-5 w-5 text-cyan-200" />
                    </div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/55">{item.label}</p>
                    <p className="mt-2 text-sm font-bold text-white">{item.value}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {benefits.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: index * 0.08, duration: 0.45 }}
                  className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-4 text-white/90 backdrop-blur-xl"
                >
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.accent}`} />
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                    <Icon className="h-5 w-5 text-cyan-200" />
                  </div>
                  <h3 className="mb-2 text-base font-bold">{item.title}</h3>
                  <p className="text-sm leading-6 text-white/65">{item.description}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
