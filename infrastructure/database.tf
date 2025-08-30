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

resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = "meqenetadmin"
    password = random_password.db_password.result
  })
}

resource "aws_db_instance" "default" {
  allocated_storage    = 20
  engine               = "postgres"
  engine_version       = "15.3"
  instance_class       = "db.t3.micro"
  name                 = "meqenetdb"
  username             = jsondecode(aws_secretsmanager_secret_version.db_password.secret_string).username
  password             = jsondecode(aws_secretsmanager_secret_version.db_password.secret_string).password
  db_subnet_group_name = aws_db_subnet_group.default.name
  vpc_security_group_ids = [aws_security_group.db.id]

  # Security improvements
  storage_encrypted = true
  backup_retention_period = 7
  deletion_protection = true

  # Additional security settings
  publicly_accessible = false
  multi_az = false

  tags = {
    Name = "meqenet-rds-instance"
  }
}
