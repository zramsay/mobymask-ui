export const checkMemberStatus = async (id, latestBlock, isMember) => {
  let codedName = sanitizeValue(id.toLowerCase());

  try {
    const { data: latestBlockData } = await latestBlock();
    const { data } = await isMember({
      blockHash: latestBlockData?.latestBlock?.hash,
      key0: codedName,
    });
    return data;
  } catch (err) {
    console.error(err);
  }
};

export function sanitizeValue(value) {
  value = value.indexOf("@") === 0 ? value.slice(1) : value;

  return `TWT:${value}`;
}

export const endorseHandle = ({
  store,
  setStore,
  clearMember = () => {},
  member,
  checkResult,
}) => {
  const isMember = store.find((item) => item.name === member);
  if (!isMember && member) {
    const info = {
      name: member,
      status: checkResult ? "yes" : "no",
    };
    setStore([...store, info]);
  }
  clearMember("");
};
