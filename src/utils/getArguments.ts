export default (command: string) => {
  const args = command.split(' ').filter(item => item);

  return {
    full: command,
    name: args[0],
    args: args.slice(1),
  };
}