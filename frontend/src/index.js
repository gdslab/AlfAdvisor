import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from "react-router-dom";
import 'leaflet/dist/leaflet.css'
import { AuthProvider } from './components/Authentication/context/AuthProvider';

const root = ReactDOM.createRoot(document.getElementById('main-map'));
root.render(
    <BrowserRouter>
        <AuthProvider>
            <App />
        </AuthProvider>
    </BrowserRouter>
);

