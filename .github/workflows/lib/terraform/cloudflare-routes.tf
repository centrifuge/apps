terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 3.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Single Redirects resource
resource "cloudflare_ruleset" "single_redirects_example" {
  zone_id     = var.zone_id
  name        = "redirects"
  description = "Redirects ruleset"
  kind        = "zone"
  phase       = "http_request_dynamic_redirect"

  rules {
    action = "redirect"
    action_parameters {
      from_value {
        status_code = 301
        target_url {
          value = var.target_url
        }
        preserve_query_string = false
      }
    }
    expression  = "(http.request.uri.path matches \"^/${var.redirect_path}/\")"
    description = "Redirect /functions to Google Functions endpoint URL"
    enabled     = true
  }
}
