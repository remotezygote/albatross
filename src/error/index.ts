export const errors: Error[] = []

export const reportError = (error: Error) => errors.push(error)

export const exitWithErrors = () => {
  if (errors.length) {
    console.error('Errors found:')
    errors.forEach(e => console.error(` - ${e.message}`))
    process.exit(1)
  } else {
    console.log(' ✔ Done!')
    process.exit(0)
  }
}
