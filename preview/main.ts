import { mount } from 'svelte';
import ShoppingStore from '../src/lib/mobile/MobileShop.svelte';

mount(ShoppingStore, { target: document.getElementById('app')! });
