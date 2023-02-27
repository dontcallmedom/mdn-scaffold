---
title: <%= iface %>.<%= membername %>
slug: Web/API/<%= iface %>/<%= membername %>
page-type: web-api-<% if (static) { %>static<% } else { %>instance<% } %>-property
<% if (experimental) { %>
status:
- experimental
<% } %>
browser-compat: api.<%= iface %>.<%= membername %>
---
{{APIRef("<%=groupdataname%>")}}
<% if (experimental) { %>
{{SeeCompatTable}}
<% } %>
<% if (securecontext) { %>
{{SecureContext_Header}}
<% } %>

TOWRITE: Summary paragraph


## Value

TOWRITE: Include a description of the property's value, including data type and what it represents.

## Examples

## Specifications

{{Specifications}}

## Browser compatibility

{{Compat}}

