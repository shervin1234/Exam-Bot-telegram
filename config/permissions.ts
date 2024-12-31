export const permissions = {
    admin: {
      start: true,
      help: true,
      admin: true,
      '*': true,
    },
    member: {
      start: true,
      help: true,
      admin: false,
      '*': false,
    },
    all: {
      '*': false,
    },
  };