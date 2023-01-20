//import * as zip from "https://deno.land/x/zipjs/index.js";

const parse = WebIDL2.parse;

const [groupData, interfaces] = await Promise.all(["https://raw.githubusercontent.com/mdn/content/main/files/jsondata/GroupData.json", "https://raw.githubusercontent.com/w3c/webref/curated/ed/idlnames.json"].map(url => fetch(url).then(r => r.json() )));
const groupDataSelector = document.getElementById("api");
Object.keys(groupData[0]).forEach(name => {
  const option = document.createElement("option");
  option.textContent = name;
  groupDataSelector.append(option);
});
const interfaceSelector = document.getElementById("interface");
Object.keys(interfaces).forEach(name => {
  const option = document.createElement("option");
  option.textContent = name;
  interfaceSelector.append(option);
});

const _idlCache = {};

async function getIdl(name) {
  if (!_idlCache[name]) {
    const idlUrl = `https://w3c.github.io/webref/ed/idlnamesparsed/${name}.json`;
    try {
      const idlData = await fetch(idlUrl).then(r => r.json());
      _idlCache[name] = idlData;
    } catch (e) {
      const err = new Error(`Failed to parse data from ${idlUrl}`);
      err.cause = e;
      throw err;
    }
  }
  return _idlCache[name];
}

function getParsedIdl(idlData) {
  return parse(idlData.defined.fragment + idlData.extended.map(e => e.fragment).join("\n") + idlData.includes.map(e => e.defined.fragment).join("\n"));
}

const isStatic = m => m.special === "static";
const not = f => m => !f(m);
const isEventHandler = m => m.type === "attribute" && m.name.startsWith("on") && m.idlType?.idlType === "EventHandler";
const isAttribute = m => m.type === "attribute";
const isConstructor = m => m.type === "constructor";
const isOperation = m => m.type === "operation";
const hasName = name => m => m.name === name;
const hasSecureContextExtAttr = ea => ea.name === "SecureContext";

function formatIdlType(idlType) {
  // TODO: deal with complexity of idlType
  return typeof idlType === "string" ? idlType : idlType.idlType;
}

function getMembers(idls, predicates = [x => true]) {
  predicates = Array.isArray(predicates) ? predicates : [predicates];

  const members = idls.filter(i => i.members).map(i => i.members.filter(m => predicates.every(f => f(m)))).flat();
  // TODO: remove dups due to overloaded operations?
  // TODO: filter name-less operations

  if (members.length === 0) return null;
  return members;
}

// Web API
// can experimental be calculated based on BCD?
async function generateInterfacePage(iface, groupdataname, options = {experimental: false}) {
  const ifaceData = {
    iface,
    experimental: options.experimental,
    groupdataname
  };

  const idlData = await getIdl(iface);
  const parsedIdl = getParsedIdl(idlData);

  const mainIdl = parsedIdl[0];
  ifaceData.securecontext = mainIdl.extAttrs.find(hasSecureContextExtAttr);
  ifaceData.constructor = mainIdl.members.find(isConstructor);

  ifaceData.staticproperties = getMembers(parsedIdl, [isAttribute, isStatic]);
  ifaceData.properties = getMembers(parsedIdl, [isAttribute, not(isStatic), not(isEventHandler)]);
  ifaceData.staticmethods = getMembers(parsedIdl, [isOperation, isStatic]);
  ifaceData.methods = getMembers(parsedIdl, [isOperation, not(isStatic)]);

  ifaceData.events = (getMembers(parsedIdl, isEventHandler) || []).map(m => m.name.slice(2)).sort();

  if (!mainIdl.inheritance) {
    ifaceData.parent = null;
    ifaceData.parentstaticproperties = null;
    ifaceData.parentproperties = null;
    ifaceData.parentstaticmethods = null;
    ifaceData.parentmethods = null;
  } else {
    const parent = idlData.inheritance;
    ifaceData.parent = parent.name;
    const parentIdl = parse(parent.defined.fragment);
    ifaceData.parentstaticproperties = getMembers(parentIdl, [isAttribute, isStatic]);
    ifaceData.parentproperties = getMembers(parentIdl, [isAttribute, not(isStatic), not(isEventHandler)]);
    ifaceData.parentstaticmethods = getMembers(parentIdl, [isOperation, isStatic]);
    ifaceData.parentmethods = getMembers(parentIdl, [isOperation, not(isStatic)]);
  }
  const tmpl = await fetch("templates/web-api-interface.md").then(r => r.text());
  return ejs.render(tmpl, ifaceData);
}

const idlType2PageType = {
  "operation": "method",
  "attribute": "property"
};

async function generateSubInterfacePage(iface, membername, staticMember, groupdataname, options = {experimental: false}) {
  const memberData = {
    iface,
    membername,
    experimental: options.experimental,
    groupdataname,
    static: staticMember,
    returnvalue: null
  };
  const idlData = await getIdl(iface);
  const parsedIdl = getParsedIdl(idlData);
  const matchingMembers = getMembers(parsedIdl, [staticMember? isStatic : not(isStatic), hasName(membername)]);
  if (!matchingMembers) {
    throw new Error(`Unknown ${iface}.${membername}`);
  }
  const member = matchingMembers[0];
  memberData.securecontext = parsedIdl[0].extAttrs.find(hasSecureContextExtAttr) || member.extAttrs.find(hasSecureContextExtAttr);

  if (isConstructor(member) || isOperation(member)) {
    memberData.parameters = member.arguments.map(a => { return {name: a.name, type: formatIdlType(a.idlType), optional: a.optional} ; });
    memberData.parameters = memberData.parameters.length ? memberData.parameters : null;
  }
  if (isOperation(member)) {
    memberData.returnvalue = member.idlType !== "undefined" ? formatIdlType(member.idlType) : null;
  }
  const tmpl = await fetch(`templates/web-api-${idlType2PageType[member.type]}.md`).then(r => r.text());
  return ejs.render(tmpl, memberData);

}

document.getElementById("interface").addEventListener("change", async function(e) {
  if (e.target.value) {
    const ifaceName = e.target.value;
    const memberSelector = document.getElementById("member");
    const apiSelector = document.getElementById("api");
    // reset
    memberSelector.innerHTML = `<option value="">Interface page</option>`;
    (apiSelector.querySelector("option[selected]") || {}).selected = false;
    const parsedIdl = getParsedIdl(await getIdl(ifaceName));
    (getMembers(parsedIdl, [isAttribute, (m => m.name)]) || []).concat(
      getMembers(parsedIdl, isConstructor) || [],
      getMembers(parsedIdl, [isOperation, (m => m.name)]) || []
    ).forEach(m => {
      const option = document.createElement("option");
      option.value = m.name ? m.name : m.type;
      option.textContent = m.type === "constructor" ? m.type : (m.type === "operation" ? m.name + "()" : m.name);
      memberSelector.append(option);
    });
    const groupName =  Object.keys(groupData[0]).find(api => groupData[0][api].interfaces?.includes(ifaceName));
    if (groupName) {
      [...apiSelector.querySelectorAll("option")].find(o => o.textContent === groupName).selected = true;
    }
  }
});

document.getElementById("generate").addEventListener("click", async function(e) {
  e.preventDefault();
  try {
    if (!document.getElementById("member").value) {
      document.getElementById("output").textContent = await generateInterfacePage(
	document.getElementById("interface").value,
	document.getElementById("api").value,
	{experimental: document.getElementById("experimental").checked}
      );
    } else {
      document.getElementById("output").textContent = await generateSubInterfacePage(
	document.getElementById("interface").value,
	document.getElementById("member").value,
	false, // TODO surface whether the method is static or not
	document.getElementById("api").value,
	{experimental: document.getElementById("experimental").checked}
      );
    }
  } catch (e) {
    document.getElementById("output").textContent = e.message;
    console.error(e);
  }
});
