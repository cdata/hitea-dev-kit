import { provide } from '@0xcda7a/bag-of-tricks/lib/state/provide.js';
import { store } from '../state/store.js';

provide(self, store);

import('../components/drawing-room-app.js');
