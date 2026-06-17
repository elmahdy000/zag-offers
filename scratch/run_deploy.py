import sys
import paramiko

def main():
    hostname = "zagoffers.online"
    port = 22
    username = "root"
    password = r"e#LWhcSAa6B&R8s"
    
    print("Connecting to the VPS...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(hostname, port, username, password, timeout=30)
        print("Connected! Executing deploy.sh...")
        
        stdin, stdout, stderr = ssh.exec_command("bash /var/www/zag-offers/deploy.sh")
        
        while True:
            line = stdout.readline()
            if not line:
                break
            safe_line = line.encode(sys.stdout.encoding, errors='replace').decode(sys.stdout.encoding)
            sys.stdout.write(safe_line)
            sys.stdout.flush()
            
        err = stderr.read().decode('utf-8', errors='replace')
        if err:
            safe_err = err.encode(sys.stdout.encoding, errors='replace').decode(sys.stdout.encoding)
            print("\n[STDERR]", safe_err)
            
        print("\nDeployment completed.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
