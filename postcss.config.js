module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? {
      'postcss-calc': {
        preserve: true,
        warnWhenCannotResolve: false
      }
    } : {})
  },
}
