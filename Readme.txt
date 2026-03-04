Task 1 – Local Network Scan using Nmap

Objective:
Perform a basic network reconnaissance on my local network using Nmap to discover devices, open ports, and potential security risks.

Tools Used:
- Nmap 7.98 (Windows)
- Command Prompt / VS Code terminal
- (Optional) Wireshark for packet capture
- Git & GitHub for documentation

Steps Taken:
1. Installed Nmap for Windows from nmap.org.
2. Found local network IP range using ipconfig:
   - IPv4 Address: 192.168.1.19
   - Subnet Mask: 255.255.255.0 → Network range = 192.168.1.0/24
   - Default Gateway: 192.168.1.1
3. Ran TCP SYN scan:
   nmap -sS 192.168.1.0/24 -oN scan_results.txt
4. Saved scan results to scan_results.txt.
5. (Optional) Captured packets in Wireshark while scanning.
6. Researched open ports and identified potential risks.
7. Documented findings and uploaded all files to GitHub.

Scan Results:

1. 192.168.1.1 (Router / Gateway)
   - Open ports:
     53/tcp → DNS
     80/tcp → HTTP
     443/tcp → HTTPS
     5555/tcp → Freeciv
   - Closed ports: 8080/tcp, 8200/tcp
   - MAC Address: B4:A7:C6:3A:26:D0 (Servercom India Pvt. Ltd)

2. 192.168.1.3
   - All scanned ports closed

3. 192.168.1.11
   - All scanned ports closed

4. 192.168.1.12 (Amazon device)
   - Open ports:
     1080/tcp → SOCKS proxy
     8888/tcp → Sun-answerbook
   - MAC Address: F8:54:B8:25:1B:53

5. 192.168.1.19 (My PC)
   - Open ports:
     135/tcp → msrpc
     139/tcp → netbios-ssn
     445/tcp → microsoft-ds
     12345/tcp → netbus (suspicious, check system security)

Security Risks & Mitigation:
- Router ports exposed → use strong passwords and firewall rules
- Windows SMB ports (135, 139, 445) → restrict access, enable updates
- Netbus port (12345) → investigate and secure system
- Open proxy (1080) → ensure it is not misconfigured or accessible externally

Interview Questions:

1. What is an open port?
   A port actively listening for network connections.

2. How does a TCP SYN scan work?
   Sends SYN packets to detect open ports; a SYN-ACK means the port is open.

3. Risks of open ports?
   Exposed services can be exploited by attackers.

4. Difference between TCP and UDP scanning?
   - TCP is connection-oriented (SYN, ACK handshake)
   - UDP is connectionless, harder to detect

5. How to secure open ports?
   Disable unused services, use firewalls, patch vulnerabilities.

6. Role of a firewall?
   Blocks or filters unwanted traffic to specific ports.

7. Why do attackers scan ports?
   To identify potential services to exploit.

8. How does Wireshark complement Nmap scanning?
   It captures packets, allowing analysis of Nmap probes and network traffic.

Repository Contents:
- scan_results.txt → Raw Nmap output
- README.txt → This documentation
- screenshots/ → Optional screenshots of Command Prompt and Wireshark
