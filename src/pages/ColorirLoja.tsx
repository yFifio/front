import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Palette, Paintbrush, RefreshCcw, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  applyStoreTheme,
  clearStoredStoreTheme,
  createRandomStoreTheme,
  defaultStoreTheme,
  getStoredStoreTheme,
  hslTripletToHex,
  hexToHslTriplet,
  saveStoreTheme,
  storeThemeSections,
  type StoreTheme,
  type StoreThemeKey,
} from '@/lib/storeTheme';

const previewBadges = ['Arco-íris', 'Criatividade', 'Diversão'];

export default function ColorirLoja() {
  const [theme, setTheme] = useState<StoreTheme>(() => getStoredStoreTheme());

  useEffect(() => {
    applyStoreTheme(theme);
    saveStoreTheme(theme);
  }, [theme]);

  const activePalette = useMemo(
    () => [theme.primary, theme.secondary, theme.accent, theme.ebook, theme.coloring].map(hslTripletToHex),
    [theme]
  );

  const updateThemeColor = (key: StoreThemeKey, hex: string) => {
    const nextTheme = {
      ...theme,
      [key]: hexToHslTriplet(hex),
    };

    setTheme(nextTheme);
  };

  const handleRandomize = () => {
    setTheme(createRandomStoreTheme());
  };

  const handleReset = () => {
    clearStoredStoreTheme();
    setTheme(defaultStoreTheme);
    applyStoreTheme(defaultStoreTheme);
  };

  return (
    <div className="min-h-screen px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="glass-panel overflow-hidden rounded-[2rem] border border-white/10 p-6 md:p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-cyan-100/90">
                <Paintbrush className="h-4 w-4 text-coloring" />
                Colorir Loja
              </div>
              <h1 className="text-3xl font-black text-foreground md:text-5xl font-display">
                Pinte a loja do seu jeito
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-foreground/80 md:text-lg">
                Abra a brincadeira, troque as cores da loja em tempo real e transforme a experiência em um passatempo criativo para as crianças.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {previewBadges.map((badge) => (
                  <span key={badge} className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/80">
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary" className="border border-white/10 bg-white/10 text-foreground hover:bg-white/20">
                <Link to="/">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para a loja
                </Link>
              </Button>
              <Button onClick={handleRandomize} className="shadow-playful">
                <Wand2 className="h-4 w-4" />
                Surpresa divertida
              </Button>
              <Button onClick={handleReset} variant="outline" className="border-white/15 bg-transparent hover:bg-white/10">
                <RefreshCcw className="h-4 w-4" />
                Restaurar cores
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            {storeThemeSections.map((section, sectionIndex) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: sectionIndex * 0.06 }}
              >
                <Card className="glass-panel border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle className="text-xl font-black font-display text-foreground">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {section.fields.map((field) => {
                        const hexValue = hslTripletToHex(theme[field.key]);

                        return (
                          <div key={field.key} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="mb-3 flex items-start justify-between gap-3">
                              <div>
                                <Label className="text-sm font-bold text-foreground">{field.label}</Label>
                                <p className="mt-1 text-xs leading-5 text-muted-foreground">{field.hint}</p>
                              </div>
                              <span
                                className="mt-0.5 h-8 w-8 rounded-full border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                                style={{ backgroundColor: hexValue }}
                              />
                            </div>

                            <div className="flex items-center gap-3">
                              <Input
                                type="color"
                                value={hexValue}
                                onChange={(event) => updateThemeColor(field.key, event.target.value)}
                                className="h-12 w-16 cursor-pointer overflow-hidden rounded-xl border-white/15 bg-transparent p-1"
                              />
                              <div className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-foreground/80">
                                {hexValue}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.12 }}>
              <Card className="glass-panel border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl font-black font-display">
                    <Palette className="h-5 w-5 text-coloring" />
                    Prévia ao vivo
                  </CardTitle>
                  <CardDescription>As mudanças aparecem na hora na loja inteira.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-5 gap-2">
                    {activePalette.map((color, index) => (
                      <div key={index} className="h-12 rounded-2xl border border-white/10" style={{ backgroundColor: color }} />
                    ))}
                  </div>

                  <div className="rounded-[1.75rem] border border-white/10 bg-background/80 p-5 shadow-card">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.28em] text-muted-foreground">Mini loja</p>
                        <h3 className="mt-2 text-2xl font-black font-display text-foreground">Kit Criativo</h3>
                      </div>
                      <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-accent-foreground">
                        Destaque
                      </span>
                    </div>

                    <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-card p-4">
                      <div className="mb-4 aspect-[4/3] rounded-[1.25rem] bg-gradient-to-br from-primary via-secondary to-accent" />
                      <p className="text-sm text-card-foreground/80">Uma prévia da vitrine com as cores escolhidas.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.18 }}>
              <Card className="glass-panel border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl font-black font-display">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Como brincar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-foreground/80">
                  <p>1. Escolha uma cor para cada parte da loja.</p>
                  <p>2. Veja a vitrine mudar na mesma hora.</p>
                  <p>3. Use a opção surpresa para gerar combinações novas.</p>
                  <p>4. Quando quiser, restaure tudo com um clique.</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
