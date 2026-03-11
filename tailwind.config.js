// Dosya: tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./options.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
            }
        },
    },
    plugins: [],
}