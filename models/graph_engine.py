import networkx as nx
import plotly.graph_objects as go
import pandas as pd
import numpy as np

class GSTNetworkAnalyzer:
    """
    NetworkX Directed Graph Engine for detecting circular trading,
    carousel invoicing loops, and suspicious supplier-buyer topology.
    """
    def __init__(self):
        self.G = nx.DiGraph()
        self.cycles = []
        self.cyclic_nodes = set()
        self.cyclic_edges = set()
        
    def build_graph(self, df_invoices, df_vendors=None):
        """
        Build directed supplier -> buyer network graph from invoice records.
        """
        self.G = nx.DiGraph()
        self.cycles = []
        self.cyclic_nodes = set()
        self.cyclic_edges = set()
        
        # Add vendor nodes with metadata if available
        if df_vendors is not None:
            for _, row in df_vendors.iterrows():
                gstin = str(row['gstin']).strip()
                self.G.add_node(
                    gstin,
                    name=row.get('vendor_name', gstin),
                    scale=row.get('scale', 'Small'),
                    state=row.get('state', 'India')
                )
                
        # Add invoice edges
        for _, row in df_invoices.iterrows():
            u = str(row.get('supplier_gstin', '')).strip()
            v = str(row.get('buyer_gstin', '')).strip()
            if not u or not v:
                continue
                
            inv_no = str(row.get('invoice_number', 'INV-UNK'))
            amt = float(row.get('total_amount', 0))
            date = str(row.get('invoice_date', ''))
            
            # Ensure nodes exist
            if not self.G.has_node(u):
                self.G.add_node(u, name=str(row.get('supplier_name', u)), scale='Unknown', state='India')
            if not self.G.has_node(v):
                self.G.add_node(v, name=str(row.get('buyer_name', v)), scale='Unknown', state='India')
                
            self.G.add_edge(u, v, invoice=inv_no, amount=amt, date=date)
            
        # Detect circular cycles
        self.detect_circular_rings()
        return self.G

    def detect_circular_rings(self):
        """
        Detect simple cycles in the directed graph using NetworkX.
        Returns list of cycle details with participants and loop value.
        """
        try:
            raw_cycles = list(nx.simple_cycles(self.G))
        except Exception:
            raw_cycles = []
            
        self.cycles = []
        self.cyclic_nodes = set()
        self.cyclic_edges = set()
        
        for c in raw_cycles:
            # We focus on short cycles (length 2 to 6) which represent carousel fraud rings
            if 2 <= len(c) <= 6:
                cycle_nodes = list(c)
                # Form list of edges in cycle
                edges = []
                amounts = []
                for i in range(len(c)):
                    source = c[i]
                    target = c[(i + 1) % len(c)]
                    edge_data = self.G.get_edge_data(source, target)
                    if edge_data:
                        edges.append((source, target, edge_data.get('invoice'), edge_data.get('amount', 0)))
                        amounts.append(edge_data.get('amount', 0))
                        self.cyclic_edges.add((source, target))
                        self.cyclic_edges.add((edge_data.get('invoice'),)) # Store invoice tag
                    self.cyclic_nodes.add(source)
                    
                total_volume = sum(amounts)
                min_amt = min(amounts) if amounts else 0
                max_amt = max(amounts) if amounts else 1
                # Value retention ratio: ~1.0 means round-tripping with no real business margin
                retention_ratio = round((min_amt / max(max_amt, 1.0)) * 100.0, 1)
                
                names = [self.G.nodes[n].get('name', n) for n in cycle_nodes]
                
                self.cycles.append({
                    'cycle_length': len(c),
                    'gstin_path': cycle_nodes + [cycle_nodes[0]],
                    'name_path': names + [names[0]],
                    'edges': edges,
                    'total_circulated_amt': total_volume,
                    'retention_ratio': retention_ratio,
                    'risk_level': 'Critical' if retention_ratio > 80 else 'High'
                })
                
        return self.cycles

    def get_invoice_network_signals(self, inv_row):
        """
        Check if an individual invoice is part of an active circular carousel ring.
        """
        u = str(inv_row.get('supplier_gstin', '')).strip()
        v = str(inv_row.get('buyer_gstin', '')).strip()
        inv_no = str(inv_row.get('invoice_number', '')).strip()
        
        is_cyclic = False
        cycle_details = None
        
        for cyc in self.cycles:
            gstins = cyc['gstin_path']
            for i in range(len(gstins) - 1):
                if gstins[i] == u and gstins[i+1] == v:
                    is_cyclic = True
                    cycle_details = cyc
                    break
            if is_cyclic:
                break
                
        if is_cyclic:
            return {
                'is_circular_ring': True,
                'network_penalty': 85.0,
                'cycle_path': " → ".join(cycle_details['name_path']),
                'retention_pct': cycle_details['retention_ratio'],
                'message': f"Circular loop detected: {cycle_details['cycle_length']}-node ring with {cycle_details['retention_ratio']}% value retention."
            }
        elif u in self.cyclic_nodes or v in self.cyclic_nodes:
            return {
                'is_circular_ring': False,
                'network_penalty': 25.0,
                'cycle_path': None,
                'retention_pct': 0,
                'message': "Entity is directly connected to a known circular trading participant."
            }
        else:
            return {
                'is_circular_ring': False,
                'network_penalty': 0.0,
                'cycle_path': None,
                'retention_pct': 0,
                'message': "Clean supplier-buyer topology."
            }

    def generate_plotly_figure(self):
        """
        Generate an interactive 2D Plotly directed network graph
        highlighting businesses and circular invoice rings.
        """
        if len(self.G.nodes) == 0:
            fig = go.Figure()
            fig.update_layout(title="No graph data available")
            return fig
            
        pos = nx.spring_layout(self.G, k=0.9, iterations=60, seed=42)
        
        # Edge traces
        edge_x = []
        edge_y = []
        ring_edge_x = []
        ring_edge_y = []
        
        for edge in self.G.edges(data=True):
            u, v, data = edge
            x0, y0 = pos[u]
            x1, y1 = pos[v]
            
            is_ring = (u, v) in self.cyclic_edges
            if is_ring:
                ring_edge_x.extend([x0, x1, None])
                ring_edge_y.extend([y0, y1, None])
            else:
                edge_x.extend([x0, x1, None])
                edge_y.extend([y0, y1, None])
                
        # Normal edges trace
        edge_trace = go.Scatter(
            x=edge_x, y=edge_y,
            line=dict(width=1.2, color='#64748b'),
            hoverinfo='none',
            mode='lines',
            name='Standard Transactions'
        )
        
        # Circular ring edges trace (bold red)
        ring_edge_trace = go.Scatter(
            x=ring_edge_x, y=ring_edge_y,
            line=dict(width=3.5, color='#ef4444', dash='solid'),
            hoverinfo='text',
            text='CIRCULAR RING INVOICE LOOP',
            mode='lines',
            name='Circular Invoicing Loop'
        )
        
        # Node traces
        node_x = []
        node_y = []
        node_colors = []
        node_sizes = []
        node_hover_texts = []
        node_labels = []
        
        for node in self.G.nodes():
            x, y = pos[node]
            node_x.append(x)
            node_y.append(y)
            
            info = self.G.nodes[node]
            name = info.get('name', node)
            short_name = name[:18] + '..' if len(name) > 18 else name
            node_labels.append(short_name)
            
            in_deg = self.G.in_degree(node)
            out_deg = self.G.out_degree(node)
            
            if node in self.cyclic_nodes:
                node_colors.append('#ef4444') # Red for circular ring
                node_sizes.append(26)
                status = "🚨 CIRCULAR TRADING RING PARTICIPANT"
            else:
                node_colors.append('#06b6d4') # Cyan for normal
                node_sizes.append(18)
                status = "✅ Normal Business Node"
                
            hover_text = (
                f"<b>{name}</b><br>"
                f"GSTIN: {node}<br>"
                f"Status: {status}<br>"
                f"Supplying to: {out_deg} buyers<br>"
                f"Receiving from: {in_deg} vendors"
            )
            node_hover_texts.append(hover_text)
            
        node_trace = go.Scatter(
            x=node_x, y=node_y,
            mode='markers+text',
            text=node_labels,
            textposition='top center',
            textfont=dict(size=9, color='#f8fafc'),
            hoverinfo='text',
            hovertext=node_hover_texts,
            marker=dict(
                color=node_colors,
                size=node_sizes,
                line=dict(width=2, color='#ffffff')
            ),
            name='Businesses'
        )
        
        fig = go.Figure(
            data=[edge_trace, ring_edge_trace, node_trace],
            layout=go.Layout(
                title=dict(
                    text="<b>Supplier–Buyer Topology & Circular Carousel Ring Detection</b>",
                    font=dict(size=15, color='#f8fafc')
                ),
                showlegend=True,
                hovermode='closest',
                margin=dict(b=20, l=10, r=10, t=40),
                paper_bgcolor='#0f172a',
                plot_bgcolor='#0f172a',
                xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                legend=dict(
                    font=dict(color='#e2e8f0'),
                    bgcolor='rgba(15, 23, 42, 0.7)'
                )
            )
        )
        return fig
