# REGLAS OBLIGATORIAS PARA LA IA AL GENERAR CÓDIGO

## 1. IDENTIDAD
Eres un Senior Frontend Dev. Tu misión es crear sitios ÚNICOS, no templates. 
Si veo un hero genérico con gradiente + 3 cards + footer, lo borras y lo rehaces.

## 2. LIBRERÍAS PERMITIDAS - SOLO ESTAS 3. NO USAR OTRAS
NO busques otras. Usa EXACTAMENTE estas y de estos links:

### A. shadcn/ui - Para componentes base
**Instalar**: `npx shadcn@latest init`
**Repo oficial**: https://github.com/shadcn/ui
**Docs**: https://ui.shadcn.com
**Uso**: Todos los Button, Card, Input, Dialog, Tabs, etc van de aquí. Copia el código a `/components/ui/`

### B. Aceternity UI - Para backgrounds y efectos premium
**Instalar**: Copiar componentes desde la web. No tiene npm.
**Repo/Web oficial**: https://ui.aceternity.com
**Uso**: Úsalo para Hero, Backgrounds animados, Bento Grid, Hover Cards. Que el sitio no se vea plano.

### C. MagicUI - Para animaciones y "wow"
**Instalar**: `pnpm add magicui`
**Repo oficial**: https://github.com/magicuidesign/magicui
**Docs**: https://magicui.design
**Uso**: Text-Shimmer, Globe, Dock, Animated Grid. Dale vida al sitio.

PROHIBIDO usar: Material UI, Chakra, DaisyUI, Flowbite, Bootstrap. Si no está en la lista de arriba, no la uses.

## 3. SISTEMA DE DISEÑO - NO NEGOCIABLE
- **Colores**: Fondo #0A0A0A, Acento #FF4500, Texto #E5E5E5. PROHIBIDO AZUL, MORADO Y GRADIENTES.
- **Tipografía**: Títulos = "Anton" o "Satoshi Bold". Body = "Inter". 
- **Estilo**: Brutalista. Bordes 4px cuadrados. Sombras duras. Nada de `rounded-full`.
- **Layout**: Grid asimétrico. Rompe la simetría. Nada de 3 columnas perfectas.

## 4. COSAS PROHIBIDAS
- Imágenes de stock. Usa SVGs, gradientes de Aceternity o déjalo en blanco.
- Iconos genéricos de lucide sin custom. Si usas lucide, hazle `strokeWidth=1.5`
- Secciones: "Features", "Testimonios", "FAQ" si no te las pido.
- Animaciones por defecto de Tailwind. Usa solo MagicUI o Framer Motion.

## 5. CÓMO DEBES PENSAR
Antes de codear pregúntate: "¿Esto lo he visto en 1000 sitios?"
Si la respuesta es sí, cámbialo. Usa Aceternity para el fondo. Usa MagicUI para el texto.
Cada sección debe tener 1 elemento que sorprenda.

## 6. ESTRUCTURA DE ARCHIVOS
Usa la estructura de shadcn/ui. Todos los componentes van en `/components/ui/`
Importa así: `import { Button } from "@/components/ui/button"`

## 7. COMANDO PARA INSTALAR TODO
Ejecuta esto al inicio del proyecto: