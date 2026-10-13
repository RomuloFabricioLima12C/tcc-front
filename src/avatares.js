// Frutas/legumes do site que o usuário pode escolher como foto de perfil.
// Os ids precisam ser os mesmos da lista AVATARES em back/src/routes/usuarios.js.
import { img } from './assets.js'

export const avatares = [
  { id: 'salame', nome: 'Salame', light: img.salamiAvatar, dark: img.salamiAvatarDark },
  { id: 'tomate', nome: 'Tomate', light: img.tomato },
  { id: 'cenoura', nome: 'Cenoura', light: img.carrot },
  { id: 'mirtilo', nome: 'Mirtilo', light: img.blueberry, dark: img.blueberryDark },
  { id: 'abacate', nome: 'Abacate', light: img.avocado },
  { id: 'pepino', nome: 'Pepino', light: img.cucumber, dark: img.cucumberDark },
  { id: 'cebola', nome: 'Cebola', light: img.onionGuy },
]

export const acharAvatar = (id) => avatares.find((a) => a.id === id)
