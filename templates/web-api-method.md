---
title: <%= iface %>.<%= membername %>()
slug: Web/API/<%= iface %>/<%= membername %> <%# capitalization %>
page-type: web-api-<% if (static) { %>static<% } else { %>instance<% } %>-method
<% if (experimental) { %>
tags:
- experimental
<% } %>
browser-compat: api.<%= iface %>.<%= membername %> <%# how to deal with static methods having same name as instance method? %>
---
{{APIRef("<%=groupdataname%>")}}
<% if (experimental) { %>
{{SeeCompatTable}}
<% } %>
<% if (securecontext) { %>
{{SecureContext_Header}}
<% } %>

TOWRITE: Summary paragraph

## Syntax

```js-nolint
<%= membername %>()
```

### Parameters
<% if (parameters) { %>
<% for (let param of parameters) { %>
- `<%= param.name %>` <% if (param.optional) { %>{{optional_inline}}<% } %>
  - : {{domxref("<%= param.type %>)")}}<% } %>
<% } else { %>None<% }%>

### Return value

<% if (returnvalue) { %>
{{domxref("<%= returnvalue %>")}}
<% } else { %>None<% } %>

### Exceptions

## Examples

## Specifications

{{Specifications}}

## Browser compatibility

{{Compat}}
