resource "aws_api_gateway_rest_api" "main" {
  name        = "meqenet-api-gateway"
  description = "API Gateway for the Meqenet application"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# Create a VPC link to connect API Gateway to the internal ALB
resource "aws_api_gateway_vpc_link" "main" {
  name        = "meqenet-vpc-link"
  target_arns = [aws_lb.main.arn]
}

resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "proxy" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "ANY"
  authorization = "NONE" # In a real-world scenario, you would use a custom authorizer or AWS_IAM
}

resource "aws_api_gateway_integration" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_method.proxy.resource_id
  http_method = aws_api_gateway_method.proxy.http_method

  type                    = "HTTP_PROXY"
  integration_http_method = "ANY"
  connection_type         = "VPC_LINK"
  connection_id           = aws_api_gateway_vpc_link.main.id

  # The URI should point to the ALB listener
  # The {proxy} path parameter will be forwarded to the ALB
  uri = aws_lb_listener.http.arn

  request_parameters = {
    "integration.request.path.proxy" = "method.request.path.proxy"
  }
}

resource "aws_api_gateway_deployment" "main" {
  depends_on = [aws_api_gateway_integration.proxy]

  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = "v1"
}