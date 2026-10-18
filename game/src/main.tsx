import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { IncidentFiles } from './debrief/IncidentFiles';
import { isIncidentFilesView } from './experiment/assignment';
import './styles.css';

createRoot(document.getElementById('root')!).render(<StrictMode>{isIncidentFilesView() ? <IncidentFiles /> : <App />}</StrictMode>);
