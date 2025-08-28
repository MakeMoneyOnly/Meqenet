resource "aws_db_subnet_group" "default" {
  name       = "meqenet-db-subnet-group"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]

  tags = {
    Name = "Meqenet DB subnet group"
  }
}

resource "aws_security_group" "db" {
  name        = "meqenet-db-sg"
  description = "Security group for the RDS instance"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.default.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "meqenet-db-sg"
  }
}

resource "aws_secretsmanager_secret" "db_password" {
  name = "meqenet-db-master-password"
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = "aVerySecurePassword123!"
}

resource "aws_db_instance" "default" {
  allocated_storage    = 20
  engine               = "postgres"
  engine_version       = "15.3"
  instance_class       = "db.t3.micro"
  name                 = "meqenetdb"
  username             = "meqenetadmin"
  password             = aws_secretsmanager_secret_version.db_password.secret_string
  db_subnet_group_name = aws_db_subnet_group.default.name
  vpc_security_group_ids = [aws_security_group.db.id]
  skip_final_snapshot  = true
}
